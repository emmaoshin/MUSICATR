package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"encoding/base64"
)

type App struct {
	ctx    context.Context
	logger *log.Logger
	dataPath string
}

type FileInfo struct {
	Path    string    `json:"path"`
	Name    string    `json:"name"`
	Ext     string    `json:"ext"`
	Size    int64     `json:"size"`
	ModTime string    `json:"modTime"`
	Favorite bool     `json:"favorite"`
}

type UserPreferences struct {
	Theme string `json:"theme"` // "light" or "dark"
}

type AppState struct {
	SelectedFiles []FileInfo       `json:"selectedFiles"`
	LastImage    *LastImage       `json:"lastImage"`
	Preferences  UserPreferences  `json:"preferences"`
}

type LastImage struct {
	Path      string  `json:"path"`
	Timestamp int64   `json:"timestamp"`
	Name      string  `json:"name"`
	Ext       string  `json:"ext"`
	Size      int64   `json:"size"`
}

func NewApp() *App {
	// Create a logger that writes to a file
	logFile, err := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatal("Failed to open log file:", err)
	}
	
	logger := log.New(logFile, "", log.LstdFlags)
	
	// Get the user's home directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("Failed to get home directory:", err)
	}

	// Create the app data directory if it doesn't exist
	dataPath := filepath.Join(homeDir, ".tunestr")
	if err := os.MkdirAll(dataPath, 0755); err != nil {
		log.Fatal("Failed to create data directory:", err)
	}
	
	return &App{
		logger: logger,
		dataPath: dataPath,
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	a.logger.Println("Application started")
}

func (a *App) loadState() (*AppState, error) {
	statePath := filepath.Join(a.dataPath, "state.json")
	
	// If the file doesn't exist, return empty state with default preferences
	if _, err := os.Stat(statePath); os.IsNotExist(err) {
		return &AppState{
			SelectedFiles: []FileInfo{},
			LastImage:    nil,
			Preferences: UserPreferences{
				Theme: "light", // default theme
			},
		}, nil
	}

	data, err := os.ReadFile(statePath)
	if err != nil {
		return nil, err
	}

	var state AppState
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, err
	}

	return &state, nil
}

func (a *App) saveState(state *AppState) error {
	statePath := filepath.Join(a.dataPath, "state.json")
	
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(statePath, data, 0644)
}

func (a *App) GetState() (*AppState, error) {
	return a.loadState()
}

func (a *App) SelectFile() (*FileInfo, error) {
	a.logger.Println("Attempting to open file dialog")
	
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select File",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Images",
				Pattern:     "*.jpg;*.jpeg;*.png;*.gif;*.bmp;*.webp",
			},
		},
	})
	
	if err != nil {
		a.logger.Printf("Error selecting file: %v\n", err)
		return nil, err
	}

	// Get file info
	fileInfo, err := a.GetFileInfo(file)
	if err != nil {
		a.logger.Printf("Error getting file info: %v\n", err)
		return nil, err
	}

	// Load current state
	state, err := a.loadState()
	if err != nil {
		return nil, err
	}

	// Add new file to selected files
	state.SelectedFiles = append(state.SelectedFiles, *fileInfo)

	// For image files, convert to data URL and update last image
	if isImageFile(fileInfo.Ext) {
		dataURL, err := a.ReadFile(file)
		if err != nil {
			return nil, err
		}

		// Update last image with full file information
		state.LastImage = &LastImage{
			Path:      dataURL,
				Timestamp: time.Now().UnixMilli(),
				Name:      fileInfo.Name,
				Ext:       fileInfo.Ext,
				Size:      fileInfo.Size,
		}

		a.logger.Printf("Set last image: %+v\n", state.LastImage)
	}

	// Save updated state
	if err := a.saveState(state); err != nil {
		a.logger.Printf("Error saving state: %v\n", err)
		return nil, err
	}

	return fileInfo, nil
}

func (a *App) GetFileInfo(path string) (*FileInfo, error) {
	a.logger.Printf("Getting file info for: %s\n", path)
	
	stat, err := os.Stat(path)
	if err != nil {
		a.logger.Printf("Error getting file info: %v\n", err)
		return nil, err
	}

	name := filepath.Base(path)
	ext := filepath.Ext(path)
	size := stat.Size()
	modTime := stat.ModTime().Format(time.RFC3339)

	fileInfo := &FileInfo{
		Path:    path,
		Name:    name,
		Ext:     ext,
		Size:    size,
		ModTime: modTime,
	}

	a.logger.Printf("File info: %+v\n", fileInfo)
	return fileInfo, nil
}

func (a *App) RemoveFile(path string) error {
	state, err := a.loadState()
	if err != nil {
		return err
	}

	// Remove file from selected files
	var updatedFiles []FileInfo
	for _, file := range state.SelectedFiles {
		if file.Path != path {
			updatedFiles = append(updatedFiles, file)
		}
	}
	state.SelectedFiles = updatedFiles

	// Clear last image if it matches the removed file
	// We need to check both the data URL and original path
	if state.LastImage != nil {
		// Check if the removed file was the last image
		isLastImage := false
		for _, file := range state.SelectedFiles {
			if file.Path == path {
				isLastImage = true
				break
			}
		}
		
		if isLastImage {
			a.logger.Printf("Clearing last image as file was removed: %s", path)
			state.LastImage = nil
		}
	}

	return a.saveState(state)
}

func (a *App) ClearState() error {
	// Create a fresh state with default preferences
	state := &AppState{
		SelectedFiles: []FileInfo{},
		LastImage:    nil,
		Preferences:  UserPreferences{
			Theme: "light", // Preserve current theme if needed
		},
	}

	// Log the state reset
	a.logger.Println("Clearing application state")
	return a.saveState(state)
}

func isImageFile(ext string) bool {
	ext = strings.ToLower(ext)
	imageExtensions := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true,
		".gif": true, ".bmp": true, ".webp": true,
	}
	return imageExtensions[ext]
}

func (a *App) SelectDirectory() (string, error) {
	a.logger.Println("Attempting to open directory dialog")
	
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Folder",
	})
	
	if err != nil {
		a.logger.Printf("Error selecting directory: %v\n", err)
		return "", err
	}
	
	a.logger.Printf("Selected directory: %s\n", dir)
	return dir, err
}

func (a *App) ReadImageFile(path string) ([]byte, error) {
	return os.ReadFile(path)
}

func (a *App) ReadFile(path string) (string, error) {
	// Convert the file path to a data URL
	data, err := os.ReadFile(path)
	if err != nil {
		a.logger.Printf("Error reading file: %v\n", err)
		return "", err
	}

	// Get MIME type based on file extension
	ext := strings.ToLower(filepath.Ext(path))
	var mimeType string
	switch ext {
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".png":
		mimeType = "image/png"
	case ".gif":
		mimeType = "image/gif"
	case ".bmp":
		mimeType = "image/bmp"
	case ".webp":
		mimeType = "image/webp"
	default:
		mimeType = "application/octet-stream"
	}

	// Convert to base64
	base64Data := base64.StdEncoding.EncodeToString(data)
	dataURL := fmt.Sprintf("data:%s;base64,%s", mimeType, base64Data)

	return dataURL, nil
}

func (a *App) RenameFile(path string, newName string) error {
	state, err := a.loadState()
	if err != nil {
		return err
	}

	// Get the directory and new full path
	dir := filepath.Dir(path)
	ext := filepath.Ext(path)
	if filepath.Ext(newName) == "" {
		newName = newName + ext
	}
	newPath := filepath.Join(dir, newName)

	// Rename the actual file
	if err := os.Rename(path, newPath); err != nil {
		return fmt.Errorf("failed to rename file: %v", err)
	}

	// Update the file in selected files
	for i, file := range state.SelectedFiles {
		if file.Path == path {
			state.SelectedFiles[i].Path = newPath
			state.SelectedFiles[i].Name = newName
			break
		}
	}

	// Update last image if it matches
	if state.LastImage != nil {
		// We need to update the data URL for the last image
		if strings.HasPrefix(state.LastImage.Path, "data:") {
			// It's already a data URL, we need to check the original path
			for _, file := range state.SelectedFiles {
				if file.Path == newPath {
					// This is our renamed file, update the data URL
					dataURL, err := a.ReadFile(newPath)
					if err != nil {
						return err
					}
					state.LastImage.Path = dataURL
					break
				}
			}
		}
	}

	return a.saveState(state)
}

func (a *App) SetLastImage(path string) error {
	state, err := a.loadState()
	if err != nil {
		return err
	}

	if path == "" {
		// Clear the last image
		state.LastImage = nil
	} else {
		// Find the file in selected files
		var selectedFile *FileInfo
		for _, file := range state.SelectedFiles {
			if file.Path == path {
				selectedFile = &file
				break
			}
		}

		if selectedFile == nil {
			return fmt.Errorf("file not found in selected files")
		}

		if !isImageFile(selectedFile.Ext) {
			return fmt.Errorf("file is not an image")
		}

		// Convert to data URL
		dataURL, err := a.ReadFile(path)
		if err != nil {
			return err
		}

		// Log the file information for debugging
		a.logger.Printf("Setting last image with name: %s, ext: %s, size: %d", selectedFile.Name, selectedFile.Ext, selectedFile.Size)

		// Update last image with full file information
		state.LastImage = &LastImage{
			Path:      dataURL,
				Timestamp: time.Now().UnixMilli(),
				Name:      selectedFile.Name,  // Make sure this is set
				Ext:       selectedFile.Ext,   // Make sure this is set
				Size:      selectedFile.Size,  // Make sure this is set
		}

		// Log the created LastImage for debugging
		a.logger.Printf("Created LastImage: %+v", state.LastImage)
	}

	// Save the state
	if err := a.saveState(state); err != nil {
		a.logger.Printf("Error saving state: %v", err)
		return err
	}

	return nil
}

func (a *App) SetTheme(theme string) error {
	state, err := a.loadState()
	if err != nil {
		return err
	}

	state.Preferences.Theme = theme
	return a.saveState(state)
}

func (a *App) GetTheme() (string, error) {
	state, err := a.loadState()
	if err != nil {
		return "", err
	}

	if state.Preferences.Theme == "" {
		return "light", nil // default theme
	}
	return state.Preferences.Theme, nil
}

func (a *App) ToggleFavorite(path string) error {
	state, err := a.loadState()
	if err != nil {
		return err
	}

	// Find and toggle the favorite status
	for i, file := range state.SelectedFiles {
		if file.Path == path {
			state.SelectedFiles[i].Favorite = !state.SelectedFiles[i].Favorite
			break
		}
	}

	return a.saveState(state)
}

func (a *App) GetFavorites() ([]FileInfo, error) {
	state, err := a.loadState()
	if err != nil {
		return nil, err
	}

	// Filter favorites
	favorites := []FileInfo{}
	for _, file := range state.SelectedFiles {
		if file.Favorite {
			favorites = append(favorites, file)
		}
	}

	return favorites, nil
}

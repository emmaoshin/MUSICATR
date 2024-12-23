package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"log"
	"os"
	"path/filepath"
	"strings"
)

type App struct {
	ctx    context.Context
	logger *log.Logger
}

func NewApp() *App {
	// Create a logger that writes to a file
	logFile, err := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatal("Failed to open log file:", err)
	}
	
	logger := log.New(logFile, "", log.LstdFlags)
	
	return &App{
		logger: logger,
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	a.logger.Println("Application started")
}

func (a *App) SelectFile() (string, error) {
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
		return "", err
	}

	// Store the original file info before converting to data URL
	originalFileName := filepath.Base(file)
	originalPath := file
	originalExt := filepath.Ext(file)

	a.logger.Printf("Selected file: %s\n", originalFileName)
	a.logger.Printf("File path: %s\n", originalPath)
	
	// Convert the file to a data URL
	data, err := os.ReadFile(file)
	if err != nil {
		a.logger.Printf("Error reading file: %v\n", err)
		return "", err
	}

	// Get the MIME type based on file extension
	ext := filepath.Ext(file)
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
		mimeType = "image/jpeg"
	}

	a.logger.Printf("File type: %s\n", mimeType)
	
	dataURL := fmt.Sprintf("data:%s;base64,%s", mimeType, base64.StdEncoding.EncodeToString(data))
	// Only log the first few characters of the data URL
	a.logger.Printf("Data URL prefix: %.4s...\n", dataURL)

	// Store the original file info in the data URL as metadata
	dataURL = fmt.Sprintf("%s###%s###%s###%s", dataURL, originalFileName, originalPath, originalExt)
	
	return dataURL, nil
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

func (a *App) GetFileInfo(path string) (map[string]interface{}, error) {
	a.logger.Printf("Getting file info for: %s\n", path)
	
	fileInfo := make(map[string]interface{})
	
	// For data URLs, extract the original file info
	if len(path) > 5 && path[:5] == "data:" {
		parts := strings.Split(path, "###")
		if len(parts) == 4 {
			fileInfo["path"] = parts[2]  // Original path
			fileInfo["name"] = parts[1]  // Original filename
			fileInfo["ext"] = parts[3]   // Original extension
			a.logger.Printf("Extracted original file info from data URL: %+v\n", fileInfo)
			return fileInfo, nil
		}
		a.logger.Println("Path is a data URL without metadata")
		return fileInfo, nil
	}
	
	fileInfo["path"] = path
	fileInfo["name"] = filepath.Base(path)
	fileInfo["ext"] = filepath.Ext(path)

	// Add file existence check
	if _, err := os.Stat(path); err != nil {
		a.logger.Printf("Error checking file: %v\n", err)
		return nil, err
	}

	a.logger.Printf("File info: %+v\n", fileInfo)
	return fileInfo, nil
}

func (a *App) ReadImageFile(path string) ([]byte, error) {
	return os.ReadFile(path)
}

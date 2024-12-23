package main

import (
	"context"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"path/filepath"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) SelectFile() (string, error) {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select File",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "All Files",
				Pattern:     "*.*",
			},
		},
	})
	return file, err
}

func (a *App) SelectDirectory() (string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Folder",
	})
	return dir, err
}

func (a *App) GetFileInfo(path string) (map[string]interface{}, error) {
	fileInfo := make(map[string]interface{})
	fileInfo["path"] = path
	fileInfo["name"] = filepath.Base(path)
	fileInfo["ext"] = filepath.Ext(path)
	return fileInfo, nil
}

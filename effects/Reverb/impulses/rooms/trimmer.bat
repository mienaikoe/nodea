@echo off
setlocal enabledelayedexpansion
set X=4
set FOLDER_PATH=.
pushd %FOLDER_PATH%
for %%f in (*) do if %%f neq %~nx0 (
    set "filename=%%~nf"
    set "filename=!filename:~%X%!"
    ren "%%f" "!filename!%%~xf"
)
popd
@echo off
setlocal
title Mode Manette
python -B "%~dp0serve_local.py" --open %*
if errorlevel 1 (
    echo.
    echo Mode Manette ne peut pas demarrer. Verifie que Python 3.10 ou plus est installe.
    pause
)

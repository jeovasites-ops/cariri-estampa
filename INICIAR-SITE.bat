@echo off
title Cariri Estampa - Servidor Local
color 0A
echo.
echo  ╔══════════════════════════════════════╗
echo  ║     CARIRI ESTAMPA — SERVIDOR LOCAL  ║
echo  ║     Abrindo em: http://localhost:3000 ║
echo  ╚══════════════════════════════════════╝
echo.
echo  Nao feche esta janela enquanto usar o site!
echo.

:: Aguarda 1 segundo e abre o navegador
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000"

:: Inicia o servidor com Python
python -m http.server 3000

pause

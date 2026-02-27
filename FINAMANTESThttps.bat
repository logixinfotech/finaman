@echo off
cd /d D:\FINAMANWEB
serve -s build -l 4000 --ssl-cert "D:\FINAMANWEB\ssl\finamanerp.crt" --ssl-key "D:\FINAMANWEB\ssl\finamanerp.key"
pause

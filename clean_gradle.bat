@echo off
echo Killing Java and Gradle processes...
taskkill /F /IM java.exe
taskkill /F /IM adb.exe
taskkill /F /IM kotlin-daemon.exe
timeout /t 2 /nobreak > nul

echo Deleting corrupted metadata and script caches...
rd /S /Q "C:\Users\lomic\.gradle\caches\8.10.2\kotlin-dsl"
rd /S /Q "C:\Users\lomic\.gradle\caches\acf50e641e641a978f8afbda74a3ae97"
md "C:\Users\lomic\.gradle\caches\8.10.2\kotlin-dsl\scripts\acf50e641e641a978f8afbda74a3ae97"
echo. > "C:\Users\lomic\.gradle\caches\8.10.2\kotlin-dsl\scripts\acf50e641e641a978f8afbda74a3ae97\metadata.bin"

echo Deleting local project gradle folder
rd /S /Q ".gradle"

echo Done. Try running gradlew now.

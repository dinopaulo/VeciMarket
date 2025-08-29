@echo off
echo Configurando variables de entorno para Android...

:: Configurar ANDROID_HOME
setx ANDROID_HOME "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"

:: Configurar ANDROID_SDK_ROOT
setx ANDROID_SDK_ROOT "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"

:: Agregar platform-tools al PATH
setx PATH "%PATH%;C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools"

echo Variables de entorno configuradas.
echo Por favor, reinicia tu terminal para que los cambios surtan efecto.
pause

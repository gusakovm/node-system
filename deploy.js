require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

const deployUrl = process.env.DEPLOY_URL;
const nodeAppToken = process.env.NODE_APP_TOKEN;
const uploadFileName = process.env.UPLOAD_FILE_NAME || 'index.html';
const uploadFilePath = process.env.UPLOAD_FILE_PATH || '';

if (!deployUrl) {
  console.error('Ошибка: DEPLOY_URL не установлен в .env файле');
  process.exit(1);
}

if (!nodeAppToken) {
  console.error('Ошибка: NODE_APP_TOKEN не установлен в .env файле');
  process.exit(1);
}

const filePath = path.join(__dirname, 'dist', 'index.html');
const delay = process.env.DEPLOY_DELAY || 3000; // Задержка в миллисекундах

function deployFile() {
  const fileContent = fs.readFileSync(filePath);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'text/html',
      'Content-Length': fileContent.length,
      'nodeAPPToken': nodeAppToken,
      'x-upload-filename': uploadFileName,
      'x-upload-filepath': uploadFilePath
    }
  };

  console.log(`Ожидание ${delay/1000} секунд перед отправкой...`);
  setTimeout(() => {
    console.log('Отправка файла...');
    const req = https.request(deployUrl, options, (res) => {
      console.log(`Статус: ${res.statusCode}`);
      res.on('data', (d) => {
        process.stdout.write(d);
      });
    });

    req.on('error', (error) => {
      console.error('Ошибка при отправке файла:', error);
    });

    req.write(fileContent);
    req.end();
  }, delay);
}

deployFile();

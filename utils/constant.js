const { env } = require('./env')
let UPLOAD_PATH
let UPLOAD_URL
let dbHost
let dbUser
let dbPsw
if(env === 'dev') {
  UPLOAD_PATH = 'F:/Users/zf/upload/admin-upload-ebook'
  UPLOAD_URL =  'http://localhost:8089/admin-upload-ebook'
  dbHost = 'localhost'
  dbUser = 'root'
  dbPsw =  '123456' 
} else {
  UPLOAD_PATH = '/root/upload/admin-upload'
  UPLOAD_URL = 'http://47.104.5.0/admin-upload-ebook'
  dbHost = '47.104.5.0'
  dbUser = 'root'
  dbPsw = ''
}
module.exports = {
    CODE_ERROR: -1,
    CODE_SUCCESS: 0,
    CODE_TOKEN_EXPIRED: -2,
    PWD_SALT: 'admin_imooc_node',
    PRIVATE_KEY: 'admin_zf_node',
    JWT_EXPIRED: 60 * 60,
    UPLOAD_PATH,
    UPLOAD_URL,
    dbHost,
    dbUser,
    dbPsw,
    MIME_TYPE_EPUB: 'application/epub+zip'
}

const { MIME_TYPE_EPUB, UPLOAD_URL, UPLOAD_PATH } = require('../utils/constant')
const fs = require('fs')
const Epub = require('../utils/epub')

class Book {
    constructor(file, data) {
        if (file) {
            this.createBookFromFile(file)
        } else {
            this.createBookFromData(data)
        }
    }
    createBookFromFile(file) {
        const { destination, filename, path, originalname, mimetype = MIME_TYPE_EPUB } = file
        const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : ''
        const oldBookPath = path
        const bookPath = `${destination}/${filename}${suffix}`
        const url = `${UPLOAD_URL}/book/${filename}${suffix}`
        const unzipPath = `${UPLOAD_PATH}/unzip/${filename}`
        const unzipUrl = `${UPLOAD_URL}/unzip/${filename}`
        if(!fs.existsSync(unzipPath)) {
            fs.mkdirSync(unzipPath, { recursive: true })
        }
        if(fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)) {
            fs.renameSync(oldBookPath, bookPath)
        }
        this.fileName = filename //文件名
        this.path = `/book/${filename}${suffix}`
        this.unzipPath =`/unzip/${filename}`
        this.filePath = this.path
        this.url = url
        this.title = '' //书名
        this.author = '' //作者
        this.publisher = ''
        this.cover = ''
        this.coverPath = ''
        this.category = -1
        this.categoryText = ''
        this.language = ''
        this.unzipUrl = unzipUrl
        this.originalName = originalname
    }
    createBookFromData(data) {
        this.fileName = data.fileName
        this.bookId = data.fileName
        this.title = data.title
        this.author = data.author
        this.publisher = data.publisher
        this.language = data.language
        this.rootFile = data.rootFile
        this.cover = data.coverPath
        this.originalName = data.originalName
        this.path = data.path || data.filePath
        this.filePath = data.path || data.filePath
        this.unzipPath = data.unzipPath
        this.coverPath = data.coverPath
        this.createUser = data.username
        this.createDt = new Date().getTime()
        this.updateDt = new Date().getTime()
        this.updateType = data.updateType === 0 ? data.updateType : 1
        this.category = data.category || 99
        this.categoryText = data.categoryText || '自定义'
    }
    parse() {
        return new Promise((resolve, reject) => {
            const bookPath = `${UPLOAD_PATH}/${this.filePath}`
            if(!fs.existsSync(bookPath)) {
                reject(new Error('电子书不存在'))
            }
            const epub = new Epub(bookPath)
            epub.on('error', err => {
                reject(err)
            })
            epub.on('end', err => {
                if(err) {
                    reject(err)
                } else {
                    const {
                        language,
                        creator,
                        creatorFileAs,
                        title,
                        cover,
                        publisher
                    } = epub.metadata
                    if(!title) {
                        reject(new Error('图书标题为空'))
                    } else {
                        this.title = title
                        this.language = language || 'en'
                        this.author = creator || creatorFileAs || 'unknown'
                        this.publisher = publisher || 'unknown'
                        this.rootFile = epub.rootFile
                        const handleGetImage = (err, file ,mimeType) => {
                            if(err) {
                                reject(err)
                            } else {
                                const suffix = mimeType.split('/')[1]
                                const coverPath = `${UPLOAD_PATH}/img/${this.fileName}.${suffix}`
                                const coverUrl = `${UPLOAD_URL}/img/${this.fileName}.${suffix}`
                                fs.writeFileSync(coverPath, file, 'binary')
                                this.coverPath = `/img/${this.fileName}.${suffix}`
                                this.cover = coverUrl
                                resolve(this)
                            }
                        }
                        epub.getImage(cover, handleGetImage)
                    }
                }
            })
            epub.parse()
        })

    }
    toDb() {
        return {
            fileName: this.fileName,
            bookId: this.fileName,
            title: this.title,
            author: this.author,
            publisher: this.publisher,
            language: this.language,
            rootFile: this.rootFile,
            cover: this.cover,
            originalName: this.originalName,
            filePath: this.filePath,
            unzipPath: this.unzipPath,
            coverPath: this.coverPath,
            createUser: this.createUser,
            createDt: this.createDt,
            updateDt: this.updateDt,
            updateType: this.updateType,
            category: this.category,
            categoryText: this.categoryText
        }

    }
    reset() {
        if(Book.pathExists(this.filePath)) {
            fs.unlinkSync(Book.genPath(this.filePath))
        }
        if(Book.pathExists(this.coverPath)) {
            fs.unlinkSync(Book.genPath(this.coverPath))
        }
        if(Book.pathExists(this.unzipPath)) {
            fs.rmdirSync(Book.genPath(this.unzipPath), { recursive: true })
        }
    }
    static genPath(path) {
        if(!path.startsWith('/')) {
            path = `/${path}`
        }
        return `${UPLOAD_PATH}${path}`
    }
    static pathExists(path) {
        if(path.startsWith('UPLOAD_PATH')) {
            return fs.existsSync(path)
        } else {
            return fs.existsSync(Book.genPath(path))
        }
    }
    static genCoverUrl(book) {
        const { cover } = book
        if(cover) {
            if(cover.startsWith('/')) {
                return `${UPLOAD_URL}${cover}`
            } else {
                return `${UPLOAD_URL}/${cover}`
            }
        } else {
            return null
        }
    }
}

module.exports = Book
const Book = require('../models/Book')
const db = require('../db')

function exists(book) {
    const { title, author, publisher } = book
    const sql = `select * from book where title='${title}' and author='${author}' and publisher='${publisher}'`
    return db.queryOne(sql)
}

async function removeBook(book) {
    if(book) {
        book.reset()
        if(book.fileName) {
            const removeBookSql = `delete from book where filename='${book.fileName}'`
            await db.querySql(removeBookSql)
        }
    }
}

function insertBook(book) {
    return new Promise( async (resolve, reject) => {
        try {
            console.log(book)
            console.log(Book)
            if(book instanceof Book) {
                const result = await exists(book)
                if(result) {
                    await removeBook(book)
                    reject(new Error('电子书已存在'))
                } else {
                    await db.insert(book.toDb(), 'book')
                    resolve()
                }
            } else {
                reject(new Error('添加的图书对象不合法'))
            }
        } catch(e) {
            reject(e)
        }
    })
}

function updateBook(book) {
    return new Promise(async (resolve, reject) => {
        try {
            if(book instanceof Book) {
                const result = await getBook(book.fileName)
                if (result) {
                    const model = book.toDb()
                    if (+result.updateType === 0) {
                        reject(new Error('内置图书不能编辑'))
                    } else {
                        await db.update(model, 'book', `where fileName='${book.fileName}'`)
                        resolve()
                    }
                }
            } else {
                reject(new Error('添加的电子书不合法'))
            }
        } catch(e) {
            reject(e)
        }
    })
}

function getBook(fileName) {
    return new Promise(async (resolve, reject) => {
        const bookSql = `select * from book where fileName='${fileName}'`
        const book = await db.queryOne(bookSql)
        if(book) {
            book.cover = Book.genCoverUrl(book)
            resolve(book)
        } else {
            reject(new Error('电子书不存在'))
        }
    })
}

async function getCategory() {
    let sql = 'select * from category order by category asc'
    const result = await db.querySql(sql)
    const categoryList = []
    result.forEach(item => {
        categoryList.push({
            label: item.categoryText,
            value: item.category,
            num: item.num
        })
    })
    return categoryList
}

async function listBook(query) {
    const { title, author, category, sort, page=1, pageSize=20 } = query
    const offset = (page-1) * pageSize
    let bookSql = 'select * from book'
    let where = 'where'
    title && (where = db.andLike(where, 'title', title))
    console.log('where', where)
    author && (where = db.andLike(where, 'author', author))
    category && (where = db.and(where, 'category', category))
    if(where !== 'where') {
        bookSql = `${bookSql} ${where}`
    }
    if(sort) {
        const symbol = sort[0]
        const column = sort.slice(1)
        const order = symbol === '+' ? 'asc' : 'desc'
        bookSql = `${bookSql} order by \`${column}\` ${order}`
    }
    bookSql = `${bookSql} limit ${pageSize} offset ${offset}`
    let countSql = `select count(*) as count from book`
    if(where !== 'where') {
        countSql = `${countSql} ${where}`
    }
    const count = await db.querySql(countSql)
    console.log('count', count)
    const list = await db.querySql(bookSql)
    list.forEach(book => {
        book.cover = Book.genCoverUrl(book)
    })
    return { list, count: count[0].count, page, pageSize }
}

function deleteBook(fileName) {
    return new Promise(async (resolve, reject) => {
        let book = await getBook(fileName)
        if(book) {
            if(+book.updateType === 0) {
                reject(new Error('内置图书，不能删除'))
            } else {
                const bookObj = new Book(null, book)
                const sql = `delete from book where fileName='${fileName}'`
                db.querySql(sql).then(() => {
                    bookObj.reset()
                    resolve()
                })
            }
        } else {
            reject(new Error('电子书不存在'))
        }
    })
}

module.exports = {
    insertBook,
    updateBook,
    getBook,
    getCategory,
    listBook,
    deleteBook
}

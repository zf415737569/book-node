const mysql = require('mysql')
const constant = require('../utils/constant')
const { isObject } = require('../utils')
function connect() {
    return mysql.createConnection({
        host: constant.dbHost,
	user: constant.dbUser,
	password: constant.dbPsw,
	database: 'book',
        multipleStatements: true
    })
}

function querySql(sql) {
    const conn = connect()
    return new Promise((resolve, reject) => {
        try {
            conn.query(sql, (err, res) => {
                if(err) {
                    reject(err)
                } else {
                    resolve(res)
                }
            })
        } catch(e) {
            reject(e)
        } finally {
            conn.end()
        }
    })
}

function queryOne(sql) {
    return new Promise((resolve, reject) => {
        querySql(sql).then(results => {
            if(results && results.length > 0) {
                resolve(results[0])
            } else {
                resolve(null)
            }
        }).catch(err => {
            reject(err)
        })
    })
}

function insert(model, tableName) {
    return new Promise((resolve, reject) => {
        if(!isObject(model)) {
            reject(new Error('插入数据非对象'))
        } else {
            const keys = []
            const values = []
            Object.keys(model).forEach(key => {
                if(model.hasOwnProperty(key)) {
                    keys.push(`\`${key}\``)
                    values.push(`'${model[key]}'`)
                }
            })
            if(keys.length > 0 && values.length > 0) {
                let sql = `INSERT INTO \`${tableName}\` (`
                const keysString = keys.join(',')
                const valuesString = values.join(',')
                sql = `${sql}${keysString}) VALUES (${valuesString})`
                const conn = connect()
                try {
                    conn.query(sql, (err, result) => {
                        if(err) {
                            reject(err)
                        } else {
                            resolve(result)
                        }
                    })
                } catch(e) {
                    reject(e)
                } finally {
                    conn.end()
                }
            } else {
                reject(new Error('插入数据库失败，对象中没有任何属性'))
            }

        }
    })
}

function update(model, tableName, where) {
    return new Promise((resolve, reject) => {
        if (!isObject(model)) {
            return new Error('插入数据库失败，插入数据非对象')
        } else {
            const entry = []
            Object.keys(model).forEach(key => {
                if (model.hasOwnProperty(key)) {
                    entry.push(`\`${key}\`='${model[key]}'`)
                }
            })
            if(entry.length > 0) {
                let sql = `UPDATE \`${tableName}\` SET`
                sql = `${sql} ${entry.join(',')} ${where}`
                console.log('upload', sql)
                const conn = connect()
                try {
                    conn.query(sql, (err, result) => {
                        if(err) {
                            reject(err)
                        } else {
                            resolve(result)
                        }
                    })
                } catch(e) {
                    reject(e)
                }
            }
        }
    })
}

function and(where, k, v) {
    if(where ==='where') {
        return `${where} \`${k}\`='${v}'`
    } else {
        return `${where} and \`${k}\`='${v}'`
    }
}

function andLike(where, k, v) {
    if(where ==='where') {
        return `${where} \`${k}\` like '%${v}%'`
    } else {
        return `${where} and \`${k}\` like '%${v}%'`
    }
}

module.exports = {
    querySql,
    queryOne,
    insert,
    update,
    and,
    andLike
}

const express = require('express')
const boom = require('boom')
const userRouter = require('./user')
const bookRouter = require('./book')
const jwtAuth = require('./jwt')
const Result = require('../models/Result')

const router =  express.Router()

router.use(jwtAuth)

router.get('/', function(req, res) {
    console.log('张飞读书管理系统')
})

router.use('/user', userRouter)

router.use('/book', bookRouter)

router.use((req, res, next) => {
    next(boom.notFound('接口不存在'))
})

router.use((err, req, res, next) => {
    if(err.name && err.name === 'UnauthorizedError') {
        const { status = 401 } = err.status
        new Result( null, 'Token验证失败', {
            error: status,
            errorMsg: err.message
        }).jwtError(res.status(status))

    } else {
        const msg = err.message || '系统错误'
        const statusCode = err.output && err.output.statusCode || 500
        const errorMsg = err.output && err.output.payload && err.output.payload.error || err.message
        new Result(null, msg, {
            error: statusCode,
            errorMsg: errorMsg
        }).fail(res.status(statusCode))
    }
})

module.exports = router
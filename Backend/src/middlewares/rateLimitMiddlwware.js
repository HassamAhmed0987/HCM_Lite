import rateLimit from "express-rate-limit"



export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message:{
        success: false,
        message: "Too many request, Please try again leter!"
    }
})


export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message:{
        success: false,
        message: "Too many request, Please try again leter!"
    }
})
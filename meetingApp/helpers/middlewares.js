const {
    check,
} = require('express-validator');
const User = require("../models/user.model");



let signUpValidation = [check('password')
    .isLength({
        min: 5
    }).withMessage('Password must be at least 5 chars long')
    .matches(/\d/).withMessage('must contain a number'),
    check('email').isEmail().withMessage('Email is not valid')
    .custom(email => {
        return User.findOne({
            email: email
        }).then(user => {
            if (user) {
                throw new Error('E-mail already in use');
            }
        })
    })
];

module.exports = {
    signUpValidation: signUpValidation
}
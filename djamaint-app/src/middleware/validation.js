const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  }
  next();
}

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe trop court'),
];

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 12 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Mot de passe : min 12 caractères, majuscule, minuscule, chiffre, symbole'),
  body('firstName').trim().isLength({ min: 2, max: 50 }).escape().withMessage('Prénom invalide'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).escape().withMessage('Nom invalide'),
];

const totpRules = [
  body('token').matches(/^\d{6}$/).withMessage('Code 2FA invalide (6 chiffres)'),
];

module.exports = { validate, loginRules, registerRules, totpRules };

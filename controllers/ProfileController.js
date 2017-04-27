import mysql from 'anytv-node-mysql';
import * as errorTypes from '../helpers/errorTypes';
import { toSnakeCase } from 'case-converter';
import _ from 'lodash';


export function getProfile(req, res, next) {
    const { user } = req;
    const { id } = user;

    const start = () => {
        const query = `
            SELECT * FROM user
                NATURAL JOIN user_profile
            WHERE id = ?;
        `;

        mysql.use('master')
            .query( query, [ id ], sendData)
            .end();

    };

    const sendData = (err, result, args, lastQuery) => {
        if(err) {
            return next(errorTypes.validationError);
        }

        let toSend = result[0];
        delete toSend.password;

        res.status(200)
            .send({
                status: 200,
                message: 'GET /profile',
                user: toSend
            });
    };

    start();
}


export function editProfile(req, res, next) {
    const { id } = req.user;
    const {
        fullName,
        status,
        cleanliness,
        sex,
        smoker,
        hasOrg,
        gender,
        course,
        batch,
        birthday,
        contactNumber,
        bio,

        nickname,
        email
    } = req.body;
    const insertUser = { nickname, email };
    const insertUserProfile = {
        fullName,
        status,
        cleanliness: Number(cleanliness),
        sex,
        smoker,
        hasOrg,
        gender,
        course,
        batch,
        birthday: new Date(birthday),
        contactNumber,
        bio
    };

    /*
     * Edit Profile
     * 1) Update user table
     * 2) Update user_profile table
     */
    const start = () => {
        mysql.use('master')
            .transaction()
            .query('UPDATE user SET ? WHERE id = ?', [ toSnakeCase(insertUser), id ], checkErrors('user'))
            .query( 'UPDATE user_profile SET ? WHERE id = ?', [ toSnakeCase(insertUserProfile), id ], checkErrors('user_profile'))
            .commit(sendData);
    };

    const checkErrors = (type = 'user') => {
        return function(err, res, args, lastQuery) {
            if(err) {
                return next(errorTypes.tableInsertionError(type));
            }
        };
    }

    const sendData = (err, result, args, lastQuery) => {
        if(err) {
            return next(errorTypes.validationError);
        }

        res.status(200)
            .send({
                status: 200,
                message: 'Successfully set user_profile',
                user: req.user,
                userProfile: _.assign(insertUser, insertUserProfile)
            });
    };

    start();
}


const express = require('express')

let router = express.Router()

var Mailchimp = require('mailchimp-api-v3')
var apiKey = 'ce55e22d71e63881ff6cbcf93e01ca33-us14';

try {
    var api = new Mailchimp(apiKey);
} catch (error) {
    console.error(error.message);
}

router.post( '/add', function(req, res) {
        let listId

        if (req.body.list == 'hero') {
            listId = 'e8ff5b5e49'
        } else if (req.body.list == 'hero-subscribed') {
            listId = '6780e536a5'
        } else if (req.body.list == 'new') {
            listId = 'a4b72972f1'
        }

        let data = {
                email_address : req.body.email,
                status : 'subscribed',
                merge_fields: { }
            }
            
        if (req.body.fname) {
            data.merge_fields.FNAME = req.body.fname
        }
        if (req.body.lname) {
            data.merge_fields.LNAME = req.body.lname
        }

        api.post('/lists/' + listId + '/members', data )
            .then((result) => {
                return res.send({
                    email: result.email_address,
                    status: result.status
                })
            })
            .catch((err) => {
                // Mailchimp passes back a http status code!
                if (err.errors) {
                    console.error("errors:", err.errors)
                } else {
                    console.error(err)
                }
                return res.status(err.status).send(err)
            })
    }
)

module.exports = router

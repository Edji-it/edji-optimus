const express = require('express')

let router = express.Router()

var Mailchimp = require('mailchimp-api-v3')
var apiKey = 'ce55e22d71e63881ff6cbcf93e01ca33-us14';

try {
    var api = new Mailchimp(apiKey);
} catch (error) {
    console.log(error.message);
}

router.post( '/add', function(req, res) {
        let listId

        if (req.body.list == 'hero') {
            listId = 'e8ff5b5e49'
        } else if (req.body.list == 'new') {
            listId = 'a4b72972f1'
        }

        let data = {
                email_address : req.body.email,
                status : 'subscribed',
                merge_fields: {
                    FNAME: req.body.fname,
                    LNAME: req.body.lname
                }
            }

        api.post('/lists/' + listId + '/members', data )
            .then((result) => {
                res.send(result)
            })
            .catch((err) => {
                // Mailchimp passes back a http status code!
                res.status(err.status).send(err)
            })
    }
)

module.exports = router

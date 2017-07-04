const express = require('express')

let router = express.Router()

var MailChimpAPI = require('mailchimp').MailChimpAPI;
var apiKey = 'ce55e22d71e63881ff6cbcf93e01ca33-us14';

try {
    var api = new MailChimpAPI(apiKey, { version : '2.0' });
} catch (error) {
    console.log(error.message);
}

router.get(
    // OAuth 2 callback url. Use this url to configure your OAuth client in the
    // Google Developers console
    '/list',
    // Redirect back to the original page, if any
    (req, res) => {
        api.call('campaigns', 'list', { start: 0, limit: 25 }, function (error, data) {
            res.status(200).send(data)
        });
        // res.redirect(redirect)
    }
)


// api.call('campaigns', 'template-content', { cid: '/* CAMPAIGN ID */' }, function (error, data) {
//     if (error)
//         console.log(error.message);
//     else
//         console.log(JSON.stringify(data)); // Do something with your data!
// });


module.exports = router

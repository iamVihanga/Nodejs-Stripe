if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const PORT = process.env.PORT || 3000
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
// ----------------------------------------

const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))

// Server Routes
app.get('/store', (req, res) => {
    fs.readFile('items.json', (error, data) => {
        if (error) {
            res.status(500).end()
        } else {
            res.render('store.ejs', {
                stripePublicKey,
                stripeSecretKey,
                items: JSON.parse(data)
            })
        }
    })
})

app.post('/purchase', (req, res) => {
    fs.readFile('items.json', (error, data) => {
        if (error) {
            res.status(500).end()
        } else {
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.music.concat(itemsJson.merch)
            let total = 0

            // calculate total amount for charge
            req.body.items.forEach((item) => {
                const itemJson = itemsArray.find(i => {
                    return i.id == item.id
                })

                total = total + itemJson.price * item.quantity
            })

            // create charge
            stripe.charges.create({
                amount: total,
                source: req.body.stripeTokenId,
                currency: 'usd'
            }).then((message) => {
                console.log('Charge Successfull - Transaction ID :', message.id)
                res.json({ message: 'Successfully purchased items.' })
            }).catch(() => {
                console.log('Charge failure')
                res.status(500).end()
            })
        }
    })
})

// listen to server
app.listen(PORT, () => console.log('Your Server Started on PORT', PORT))
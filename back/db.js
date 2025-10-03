const mongoose = require("mongoose")
// const ConnectURI = "mongodb://127.0.0.1:27017/Ecommerce"
const ConnectURI = "mongodb://localhost:27017/auth"
const ConnectToMongo = async () => {
    try {
        await mongoose.connect(ConnectURI)
        console.log("Connection to mongo is a success")
    } catch (err) {
        console.log("Connection to mongo is Unsuccessful", err)
    }
}
module.exports = ConnectToMongo
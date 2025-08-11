const mongoose = require('mongoose')

const pushSubSchema = new mongoose.Schema({
  user:{ type:
    mongoose.Schema.Types.ObjectId, ref:'User',
    index:true},
    endpoint: String,
    keys:{
      p256dh: String,
      auth: String
    }
  })

  module.exports = mongoose.model('PushSub',pushSubSchema)
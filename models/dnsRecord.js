const mongoose = require('mongoose'); 

const dnsRecordSchema = new mongoose.Schema({
    domain: { type: String, required: true},
    ipAddress: { type: String, required: true}
});

module.exports = mongoose.model('DNSRecord', dnsRecordSchema);
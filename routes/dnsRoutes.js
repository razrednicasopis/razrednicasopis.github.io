// routes/dnsRoutes.js
const express = require('express');
const router = express.Router();
const DNSRecord = require('../models/dnsRecord');

// Route to get all DNS records
router.get('/dns', async (req, res) => {
  try {
    const dnsRecords = await DNSRecord.find();
    res.json(dnsRecords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to create a new DNS record
router.post('/dns', async (req, res) => {
  const dnsRecord = new DNSRecord({
    domain: req.body.domain,
    ipAddress: req.body.ipAddress
  });

  try {
    const newDNSRecord = await dnsRecord.save();
    res.status(201).json(newDNSRecord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route to update an existing DNS record
router.put('/dns/:id', async (req, res) => {
  try {
    const dnsRecord = await DNSRecord.findById(req.params.id);
    if (!dnsRecord) return res.status(404).json({ message: 'DNS record not found' });

    dnsRecord.domain = req.body.domain;
    dnsRecord.ipAddress = req.body.ipAddress;
    await dnsRecord.save();

    res.json(dnsRecord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route to delete a DNS record
router.delete('/dns/:id', async (req, res) => {
  try {
    const dnsRecord = await DNSRecord.findById(req.params.id);
    if (!dnsRecord) return res.status(404).json({ message: 'DNS record not found' });

    await dnsRecord.remove();
    res.json({ message: 'DNS record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

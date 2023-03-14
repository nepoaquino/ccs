const express = require("express");
const router = express.Router();
const Faq = require("../models/Faq");
const marked = require("marked");
const createDomPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const dompurify = createDomPurify(new JSDOM().window);

// GET - /faqs
router.get("/", async (req, res) => {
    try {
        const superAdmin = true;
        const userLogged = req.user ? true: false;
        const faqs = await Faq.find();
        res.render("faqs", { faqs, userLogged, superAdmin });
    } catch (err) { console.log(err) }
});

// POST - /faqs
router.post("/", async (req, res) => {
    const { title, description } = req.body;
    try {
        const newFaq = await Faq.create({ title, description });
        res.redirect("/faqs");
    } catch (err) { console.log(err) }
});

// GET - /faqs/:id
router.get("/:id", async (req, res) => {
    const faq = await Faq.findById(req.params.id);
    // console.log(faq)
    res.render("faq", { faq });
});

// PUT - /faqs/:id
router.put("/:id", async (req, res) => {
    // await Faq.findByIdAndUpdate(req.params.id, req.body);
    const { title, description } = req.body;
    await Faq.findOneAndUpdate(req.params.id, { 
        title, 
        description,  
        markedHtml: dompurify.sanitize(marked.parse(description))
    });
    // res.redirect(`/faqs/${req.params.id}`);
    res.redirect("/faqs");
});

module.exports = router;
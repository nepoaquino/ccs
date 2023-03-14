const express = require("express");
const router = express.Router();
const Article = require("../models/Article");
const User = require("../models/User");

const marked = require("marked");
const createDomPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const dompurify = createDomPurify(new JSDOM().window);

// GET - http://localhost:1000/articles/edit/:id
// router.get("/edit/:id", async (req, res) => {
router.get("/edit/:id", async (req, res) => {
    try {
        const userLogged = req.user ? true: false;
        const user = await User.findById(req.user._id);
        const article = await Article.findById(req.params.id);
        // console.log(article)
        res.render("edit-article", { article, user, userLogged, success_msg: req.flash("success_msg")[0]});
    } catch (err) { console.log(err) }
});

// PUT - http://localhost:1000/articles/edit/:id
router.put("/edit/:id", async (req, res) => {
    try {
        const { author, title, body } = req.body;
        // await Article.findByIdAndUpdate(req.params.id, req.body);
        await Article.findByIdAndUpdate(req.params.id, {
            author,
            title,
            body,
            markedHtml: dompurify.sanitize(marked.parse(body))
        });
        req.flash("success_msg", "Article updated!");
        // res.redirect(`/articles/edit/${req.params.id}`);
        res.redirect(`/articles`);
    } catch (err) { console.log(err) }
});

// GET - http://localhost:1000/articles/:id
router.get("/:id", async (req, res) => {
    try {
        const userLogged = req.user ? true: false;
        const article = await Article.findById(req.params.id);
        if (userLogged) {
            if (article.author._id.toString() === req.user._id) {
                article.userLogged = true;
            }
        }
        // console.log(article)
        res.render("article", { article, userLogged });
    } catch (err) { console.log(err) }
});

// DELETE - http://localhost:1000/articles/:id
router.delete("/:id", async (req, res) => {
    // console.log(req.params.id);
    await Article.findByIdAndDelete({ _id: req.params.id });
    req.flash("success_msg", "Article deleted!");
    res.redirect("/articles");
});

// GET - http://localhost:1000/articles
router.get("/", async (req, res) => {
    try {
        const userLogged = req.user ? true: false;
        const articles = await Article.find().populate("author").lean();
        articles.forEach(article => {
            if (userLogged) {
                // console.log(article.author._id.toString() === req.user._id.toString())
                if (article.author._id.toString() === req.user._id.toString()) {
                    article.userLogged = true;
                    // console.log(article)
                }
            }
        });
        // console.log(articles)
        res.render("articles", { articles, userLogged });
    } catch (err) {
        console.log(err);
    }
});

// POST - http://localhost:1000/articles
router.post("/", async (req, res) => {
    const { author, title, body } = req.body;
    try {
        const newArticle = await Article.create({ author, title, body });
        // console.log(newArticle);
        req.flash("success_msg", "Article created!");
        res.redirect("/articles");
    } catch (err) {
        console.log(err)
    }
});

module.exports = router;
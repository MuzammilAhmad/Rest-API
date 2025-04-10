const post = require("../model/post");
const Post = require("../model/post");
const User = require("../model/user");

const fs = require("fs");
const path = require("path");

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then((posts) => {
      res.status(200).json({
        message: "Fetched posts successfully!",
        posts: posts,
        totalItems: totalItems,
      });
    })
    .catch((err) => {
      res.status(500).json({ message: "Error fetching posts!", error: err });
    });
};

exports.createPost = (req, res, next) => {
  if (!req.file) {
    return res.status(422).json({ message: "No image provided" });
  }

  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  let creator;

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  post
    .save()
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "Post created successfully!",
        post: post,
        creator: {
          _id: creator._id,
          name: creator.name,
        },
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        return res.status(404).json({
          message: "Post not found!",
        });
      }
      res.status(200).json({
        message: "Post found!",
        post: post,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const clearImage = (filepath) => {
  filepath = path.join(__dirname, "..", filepath);
  fs.unlink(filepath, (err) => {
    if (err) {
      console.log(err);
    }
  });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    res.status(422).json({
      message: "File not picked!",
    });
  }

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        return res.status(404).json({
          message: "Post not found!",
        });
      }
      if (post.creator.toString() !== req.userId) {
        return res.status(403).json({
          message: "You do not have permission to update this post!",
        });
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "Post updated!",
        post: result,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId).then((post) => {
    if (!post) {
      return res.status(404).json({
        message: "Post not found!",
      });
    }
    if (post.creator.toString() !== req.userId) {
      return res.status(403).json({
        message: "You do not have permission to update this post!",
      });
    }
    clearImage(post.imageUrl);
    // Post.deleteOne({ _id: postId })
    return Post.findByIdAndDelete(postId)
      .then(() => {
        return User.findById(req.userId);
      })
      .then((user) => {
        user.posts.pull(postId);
        return user.save();
      })
      .then((result) => {
        res.status(200).json({
          message: "Post deleted!",
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

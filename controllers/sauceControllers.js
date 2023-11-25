const { error } = require('console');
const Sauce = require('../models/sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => { res.status(201).json({ message: 'Objet enregistré !' }) })
        .catch(error => { res.status(400).json({ error }) })
};

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    delete sauceObject._userId;
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Objet modifié!' }))
                    .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(400).json({ error }));
};

exports.getAllSauce = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

exports.likeSauce = (req, res, next) => {
    const { like } = req.body; // like: true para gostar, like: false para não gostar
    const userId = req.auth.userId;
    const sauceId = req.params.id;

    if (req.body.like === 1) {
        // Adiciona o usuário à lista de gostos se ainda não gostou
        Sauce.updateOne(
            { _id: sauceId },
            {
                $push: { usersLiked: userId },
                $inc: { likes: +1 }
            }
        )
            .then(() => res.status(200).json({ message: 'liked' }))
            .catch(error => res.status(400).json({ error }));



        /* sauce.usersLiked.push(userId);
         // Remove o usuário da lista de não gostos, se estiver presente
         if (dislikedIndex !== -1) {
             sauce.usersDisliked.splice(dislikedIndex, 1);
         }*/
    } else if (req.body.like === 0) {
        Sauce.findOne({ _id: req.params.id })
            .then((sauce) => {
                if (sauce.usersLiked.includes(userId)) {
                    Sauce.updateOne(
                        { _id: sauceId },
                        {
                            $push: { usersLiked: userId },
                            $inc: { likes: -1 }
                        }
                    )
                        .then(() => res.status(200).json({ message: 'unlike' }))
                        .catch(error => res.status(400).json({ error }));
                }
                if (sauce.usersDisliked.includes(userId)) {
                    Sauce.updateOne(
                        { _id: sauceId },
                        {
                            $push: { usersDisliked: userId },
                            $inc: { dislikes: -1 }
                        }

                    )
                        .then(() => res.status(200).json({ message: 'unlike' }))
                        .catch(error => res.status(400).json({ error }));
                }
            })

        /* // Adiciona o usuário à lista de não gostos se ainda não não gostou
         sauce.usersDisliked.push(userId);
         // Remove o usuário da lista de gostos, se estiver presente
         if (likedIndex !== -1) {
             sauce.usersLiked.splice(likedIndex, 1);
         }*/
    }
    // Atualiza a sauce com as novas listas de gostos e não gostos



};
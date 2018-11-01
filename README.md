## Development
**environment install**
```
npm install
bower install
```

**development**

```
gulp dev
```
Open browser: [http://localhost:3000](http://localhost:3000)

**build templates**
```
gulp fractal:build
```
will combile templates and put html files into **build** folder

**NB!** HTML for Adobe Campagin is stored under: `build/components/preview`


## Description

This is an environment to build and maintain Adobe Campagin Email **templates** and **fragments** for Tallink.

Environment is built using Fractal [https://fractal.build/](https://fractal.build/) 
and Twig [https://twig.symfony.com/doc/2.x/](https://twig.symfony.com/doc/2.x/) templates. 

The aim is to reduce HTML duplication and develope faster.

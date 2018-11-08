# Club One Header template

This is a main template for generating Club One dynamic header fragment. 
Use this to create header translations.

## Usage

1) Create new twig template (ex: new-template.twig) for your translation language and add the following code
```
{% include "@co-header-template" %}
```

2) Create configuration file for the new temaplate (ex: new-templae.config.yml)

3) Copy content from **co-header-template.config.yml** into new-template.config.yml configuration file.

4) Edit **new-template.config.yml** file as needed. 

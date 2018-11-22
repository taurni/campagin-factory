Helper component for define theme colors.

Theme variables:
* Bacground color: `bgColor`
* Text color: `textColor`
* Button background: `buttonBg`
* Button text color: `buttonColor`

Theme variants:
* seafoam
* midnight 
* buoylight
* poollight
* sunset

**Default** theme is **Seafoam** and is configured in fractal.js

##Usage

In templates:
```
background-color: \{{ theme.bgColor }}
```
```
color: \{{ theme.textColor}}
```

In configuration file:
```
variants:
  - name: default
    hidden: true
  - name: Seafoam
    context:
      theme: '@theme--seafoam'
  - name: midnight
    context:
      theme: '@theme--midnight'
  - name: buoylight
    context:
      theme: '@theme--buoylight'
  - name: poollight
    context:
      theme: '@theme--poollight'
  - name: sunset
    context:
      theme: '@theme--sunset'
```

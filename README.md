<!-- Variables -->
[Node.js]: https://nodejs.org/en/
[example]: ./usage.gif

<!-- Main -->
# mklic (make license)
CLI for generating LICENSE files.


## Getting Started
*NOTE: You need *[Node.js]* to install and run mklic*

<br>

### How To Install
---
You can install *mklic* by running the following command:

```
npm install --global mklic
```
<br>

### How To Run
---
![example]

*NOTE: The first time you use mklic, it will need an internet connection to fetch the licenses, for subsequent uses it will use the cached version, to delete the cache use the `-r` flag.*

*NOTE: deprecated and non-osi-approved licenses are hidden by default, use the `-d` and `-o` flags to show them.*

You can also pass in a name and an output path using the `-q` and `-p` flags respectively.

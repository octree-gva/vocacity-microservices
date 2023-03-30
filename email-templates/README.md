# Email templates by [moleculer-mail](https://github.com/moleculerjs/moleculer-addons/tree/master/packages/moleculer-mail#readme)

## Localisation

We have one folder per locale. **Fallbacks** are to english, always. So translate english first.

## Format

We display a `mailer/foo_bar` template just for testing purpose.

```sh
.
└── en
    └── mailer
        └── foo_bar
            ├── html.hbs
            └── subject.hbs
```

We use only [mustache `.hbs` files](http://mustache.github.io/mustache.5.html).
Use it as you want with the `mailer` service:

```
call "mailer.render" '{"data": {"foo": "voca", "bar": "random"}, "template": "mailer/foo_bar", "language":"en"}'
>> Response:
{
  html: '<!DOCTYPE html>\n' +
    '<html>\n' +
    '  <body>\n' +
    '    <h3>Welcome, hadrien!</h3>\n' +
    '  </body>\n' +
    '</html>\n',
  subject: 'Welcome, hadrien!\n'
}
```

## Naming convention

-   use `:locale/:service/:template` structure.
-   be specific on template name over short and vague (`user_reset_password_instructions` is just fine).

See more on [moleculer-mail](https://github.com/moleculerjs/moleculer-addons/tree/master/packages/moleculer-mail#readme)

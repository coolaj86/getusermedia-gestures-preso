getusermedia-gestures-preso
===========================

I beefed up [@js_dev](https://twitter.com/js_dev)'s demo on `getUserMedia`

See my blog post and video demo at <https://github.com/coolaj86/getusermedia-gestures-preso>

Try the demo now at <http://coolaj86.github.com/getusermedia-gestures-preso>

See Aaron Frost's blog post at <http://40win.com>

2014-05-01
---

Sorry this was broken for a year. It turns out that `document.width`
was deprecated and removed from Chrome. I changed that part of the code
to `$(document).width()` and now it works again.

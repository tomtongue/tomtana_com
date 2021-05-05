function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));
var Link = _interopDefault(require('next/link'));

function Nav({
  navPages
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "nav-line"
  }, navPages.map(page => {
    if (page.active) {
      return /*#__PURE__*/React.createElement("span", {
        key: page.route,
        className: "nav-link"
      }, page.frontMatter.title || page.name);
    }

    return /*#__PURE__*/React.createElement(Link, {
      key: page.route,
      href: page.route
    }, /*#__PURE__*/React.createElement("a", {
      className: "nav-link"
    }, page.frontMatter.title || page.name));
  }));
}

module.exports = Nav;

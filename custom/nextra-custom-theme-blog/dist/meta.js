function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));
var Link = _interopDefault(require('next/link'));

function Meta({
  author,
  date,
  tag,
  back
}) {
  const authorNode = author ? author : null;
  const dateNode = date ? /*#__PURE__*/React.createElement("time", null, new Date(date).toDateString()) : null;
  const tags = tag ? tag.split(',').map(s => s.trim()) : [];
  return /*#__PURE__*/React.createElement("div", {
    className: "meta-line"
  }, /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, authorNode, authorNode && dateNode ? ', ' : null, dateNode, (authorNode || dateNode) && tags.length ? ' • ' : null, tags.map(t => {
    return /*#__PURE__*/React.createElement(Link, {
      key: t,
      href: "/tags/[tag]",
      as: `/tags/${t}`
    }, /*#__PURE__*/React.createElement("a", {
      className: "tag"
    }, t));
  })), back ? /*#__PURE__*/React.createElement(Link, {
    href: back,
  }, /*#__PURE__*/React.createElement("a", {
    className: "meta-back"
  }, "Back")) : null);
}

module.exports = Meta;

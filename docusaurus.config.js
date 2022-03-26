/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'tomtana.com',
  tagline: 'Exploring unknown!',
  url: 'https://tomtana.com',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'tomtan', // Usually your GitHub org/user name.
  projectName: 'tomtana_com', // Usually your repo name.

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false,
        blog: {
          path: './blog',
          routeBasePath: '/',
          showReadingTime: true,
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          postsPerPage: 20,
          blogSidebarCount: 20
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      hideableSidebar: true,
      prism: {      
        theme: require('prism-react-renderer/themes/github'),
        darkTheme: require('prism-react-renderer/themes/nightOwl'),
        additionalLanguages: ['java', 'scala', 'swift', 'rust', 'python']
      },
      navbar: {
        title: 'Coffeeholic',
        logo: {
          alt: 'be coffeeholic',
          src: 'img/tomtana_com_icon.png',
        },
        items: [
          {to: 'about-me', label: '👦🏻About me', position: 'left'},
          {
            href: 'https://www.linkedin.com/in/tomohiro-tanaka-bb186039/',
            position: 'right',
            className: 'header-linkedin-link',
            'aria-label': 'LinkedIn',
          },
          {
            href: 'https://github.com/tomtongue',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      footer: {
        style: 'light',
        copyright: `Copyright © ${new Date().getFullYear()} tomtan. Built with Docusaurus.`,
      },
    }),
};

module.exports = config;

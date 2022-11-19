const inviteBodyStyle = `
  background-color: black !important;
  height: 300px;
  width: 550px;
`.replace(/\n/g, '');

const headerStyle = `
  color: #00fcfe;
  margin: 30px auto;
  padding: 30px;
  text-align: center;
`.replace(/\n/g, '');

const inviteButtonStyle = `
  background-color: #fffd33;
  border-radius: 5px;
  margin: 30px auto;
  padding: 10px 15px;
  text-align: center;
  width: 150px;
`.replace(/\n/g, '');

export const getInviteHtml = (poolId: string, location: Location) => {
  const { protocol, hostname } = process.env.NODE_ENV === 'production'
      ? location
      : { protocol: 'http:', hostname: 'localhost:3000' };

  return `
    <html>
      <head>
        <style type="text/css">
          a, a:link, a:visited {
            color: black !important;
            font-size: 22px;
            font-weight: bold;
            text-decoration: none;
          }
        </style>
      </head>
      <body style="${inviteBodyStyle}">
        <h2 style="${headerStyle}">You have been invited to a Pointless pool</h2>
        <div style="${inviteButtonStyle}">
          <a href="${protocol}//${hostname}/pools/${poolId}">
            Join Pool
          </a>
        </div>
      </body>
    </html>
  `.replace(/\n/g, '');
};

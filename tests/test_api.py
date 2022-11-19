import json
import requests

with open('../package.json') as f:
  package_info = json.load(f)

def test_get_welcome_success(base_url):
  url = f'{base_url}/api'
  version = package_info['version']

  response = requests.request('GET', url)
  body = response.json()

  assert response.status_code == 200
  assert body['message'] == f'Welcome to the Pointless API v{version}!'

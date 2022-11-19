import json
import pytest
import requests

def test_create_pool_missing_name(base_url, headers):
  url = f'{base_url}/api/pools'

  pool = {
    'createdBy': 'drwb333@gmail.com'
  }

  response = requests.request('POST', url, data=json.dumps(pool), headers=headers)
  body = response.json()

  assert response.status_code == 400
  assert 'ValidationError' in body['message']
  assert '"name" is required' in body['message']

def test_create_pool_missing_created_by(base_url, headers):
  url = f'{base_url}/api/pools'

  pool = {
    'name': 'My New Pool',
  }

  response = requests.request('POST', url, data=json.dumps(pool), headers=headers)
  body = response.json()

  assert response.status_code == 400
  assert 'ValidationError' in body['message']
  assert '"createdBy" is required' in body['message']

def test_get_user_pools_success(base_url):
  url = f'{base_url}/api/pools'

  params = {
    'userEmail': 'drwb333@gmail.com'
  }

  response = requests.request('GET', url, params=params)
  user_pools = response.json()

  assert response.status_code == 200
  assert len(user_pools['items']) > 0
  for user_pool in user_pools['items']:
    assert 'drwb333@gmail.com' in user_pool['users']

def test_get_pool_success(base_url, test_pool_id):
  url = f'{base_url}/api/pools/{test_pool_id}'

  response = requests.request('GET', url)
  pool = response.json()

  assert response.status_code == 200
  assert pool['_id'] == test_pool_id
  assert pool['name'] == 'My Test Pool'

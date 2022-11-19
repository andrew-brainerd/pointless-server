import json
import logging
import pytest
import requests

log = logging.getLogger('log')

@pytest.fixture
def base_url():
  return 'http://localhost:5711'

@pytest.fixture
def headers():
  return {'Content-Type': 'application/json' } 

@pytest.fixture
def logger():
  return log

@pytest.fixture
def test_pool(base_url, headers):
  url = f'{base_url}/api/pools'

  pool = {
    'name': 'My Test Pool',
    'createdBy': 'drwb333@gmail.com'
  }

  response = requests.request('POST', url, data=json.dumps(pool), headers=headers)
  new_pool = response.json()

  return new_pool

@pytest.fixture
def test_pool_id(test_pool):
  return test_pool['_id']

def test_create_pool_success(base_url, headers):
  url = f'{base_url}/api/pools'

  pool = {
    'name': 'My Test Pool',
    'createdBy': 'drwb333@gmail.com'
  }

  response = requests.request('POST', url, data=json.dumps(pool), headers=headers)
  new_pool = response.json()

  assert response.status_code == 201
  assert new_pool['name'] == 'My Test Pool'
  assert new_pool['createdBy'] == 'drwb333@gmail.com'

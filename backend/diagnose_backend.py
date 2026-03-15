import requests
import json

print("=" * 60)
print("🔍 RESCUEVISION BACKEND DIAGNOSTIC TOOL")
print("=" * 60)
print()

# Test different URL variations
urls_to_test = [
    "http://localhost:5000/api/health",
    "http://127.0.0.1:5000/api/health",
    "http://0.0.0.0:5000/api/health",
]

print("Testing backend connectivity...")
print()

backend_working = False

for url in urls_to_test:
    print(f"Testing: {url}")
    try:
        response = requests.get(url, timeout=2)
        if response.status_code == 200:
            print(f"  ✅ SUCCESS - Backend is reachable!")
            print(f"  Response: {response.json()}")
            backend_working = True
            break
        else:
            print(f"  ❌ Failed - Status code: {response.status_code}")
    except requests.exceptions.ConnectionRefusedError:
        print(f"  ❌ Connection Refused - Backend not running")
    except requests.exceptions.Timeout:
        print(f"  ❌ Timeout - Backend too slow")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()

print("=" * 60)

if backend_working:
    print("✅ BACKEND IS WORKING!")
    print()
    print("Now testing disaster report endpoint...")
    print()
    
    # Test disaster report endpoint
    test_data = {
        "name": "Test Fire",
        "location": "Test Location",
        "description": "This is a test report"
    }
    
    try:
        response = requests.post(
            "http://localhost:5000/api/disaster/report",
            json=test_data,
            timeout=5
        )
        
        if response.status_code in [200, 201]:
            print("✅ Disaster report endpoint working!")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Disaster report failed - Status: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing disaster report: {str(e)}")
    
else:
    print("❌ BACKEND IS NOT RUNNING!")
    print()
    print("STEPS TO FIX:")
    print("1. Open a new terminal/command prompt")
    print("2. Navigate to backend folder: cd backend")
    print("3. Run: python api.py")
    print("4. Wait for 'Running on http://127.0.0.1:5000' message")
    print("5. Run this diagnostic script again")

print("=" * 60)
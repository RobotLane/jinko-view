import boto3

# ⚠️ MAKE SURE THIS MATCHES YOUR ACTUAL BUCKET NAME IN AWS
BUCKET_NAME = "jinko-media-vault-bucket" 

def unlock_bucket():
    print(f"🔓 Attempting to unlock {BUCKET_NAME}...")
    try:
        s3 = boto3.client('s3')
        
        # This rule tells AWS: "Let any browser (AllowedOrigins='*') upload files (PUT)"
        cors_config = {
            'CORSRules': [{
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['PUT', 'POST', 'GET', 'HEAD'],
                'AllowedOrigins': ['*'], # In production, we change '*' to 'http://your-website.com'
                'ExposeHeaders': ['ETag'],
                'MaxAgeSeconds': 3000
            }]
        }
        
        s3.put_bucket_cors(Bucket=BUCKET_NAME, CORSConfiguration=cors_config)
        print("✅ SUCCESS: Bucket is now open for React uploads.")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print("TIP: Double check your BUCKET_NAME variable.")

if __name__ == "__main__":
    unlock_bucket()
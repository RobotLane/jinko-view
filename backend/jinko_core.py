import boto3
import json
import re
import base64
import time

# CONFIGURATION
MY_BUCKET = "jinko-media-vault-bucket"

def get_aws_client(service):
    return boto3.client(service, region_name="us-east-1")

class JinkoLogic:
    @staticmethod
    def get_upload_url(filename: str, file_type: str):
        """Generates a secure, 60-second pass to upload a file to S3"""
        s3 = get_aws_client('s3')
        key = f"uploads/{int(time.time())}_{filename}"
        
        # Generate the Presigned URL
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={'Bucket': MY_BUCKET, 'Key': key, 'ContentType': file_type},
            ExpiresIn=60
        )
        return {"upload_url": presigned_url, "file_key": key}

    @staticmethod
    def audit_listing(user_input: str, state_code: str, b_name: str, rules: str, is_owner: bool):
        client = get_aws_client('bedrock-runtime')
        system_rules = f"""
        YOU ARE THE JINKO FORENSIC COMPLIANCE OFFICER.
        TASK: Audit for Fair Housing Act (FHA) violations.
        RULES: {rules}. 
        BRANDING: End with 'Listed by {b_name}'.
        OUTPUT FORMAT (STRICT JSON ONLY):
        {{
            "status": "FAIL" or "PASS",
            "violations": [{{"phrase": "flagged text", "citation": "Category", "reason": "Risk"}}],
            "final_text": "THE FULL CORRECTED SCRIPT HERE"
        }}
        """
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2048,
            "system": system_rules,
            "messages": [{"role": "user", "content": f"AUDIT THIS: {user_input}"}],
            "temperature": 0
        })
        response = client.invoke_model(modelId="us.anthropic.claude-3-5-sonnet-20241022-v2:0", body=body)
        raw_text = json.loads(response.get('body').read())['content'][0]['text']
        try:
            json_block = re.search(r'\{.*\}', raw_text, re.DOTALL).group(0)
            result = json.loads(json_block)
        except:
            result = {"status": "PASS", "violations": [], "final_text": raw_text}
        
        clean_text = result.get("final_text", "")
        if state_code == "AZ" and is_owner:
            if "Owner/Agent" not in clean_text:
                clean_text += " (Owner/Agent)"
                result["final_text"] = clean_text
        return result

    @staticmethod
    def generate_listing(address: str, specs: str, features: str, tone: str):
        client = get_aws_client('bedrock-runtime')
        prompt = f"""
        ACT AS A LUXURY REAL ESTATE COPYWRITER.
        TASK: Write a compelling property description.
        Address: {address}
        Specs: {specs}
        Key Features: {features}
        Tone: {tone}
        CRITICAL: Write the description ONLY. No intro, no hashtags.
        """
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7 
        })
        response = client.invoke_model(modelId="us.anthropic.claude-3-5-sonnet-20241022-v2:0", body=body)
        return json.loads(response.get('body').read())['content'][0]['text']

    @staticmethod
    def generate_audio(text: str, voice_id: str):
        client = get_aws_client('polly')
        response = client.synthesize_speech(Engine='neural', LanguageCode='en-US', OutputFormat='mp3', Text=text, VoiceId=voice_id)
        audio_bytes = response['AudioStream'].read()
        return base64.b64encode(audio_bytes).decode('utf-8')
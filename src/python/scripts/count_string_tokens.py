import json
import sys
import tiktoken

def count_string_tokens(string: str, model_name: str) -> int:
    """
    Returns the number of tokens in a text string.

    Args:
        string (str): The text string.
        model_name (str): The name of the encoding to use. (e.g., "gpt-3.5-turbo")

    Returns:
        int: The number of tokens in the text string.
    """
    encoding = tiktoken.encoding_for_model(model_name)
    return len(encoding.encode(string))


raw = sys.stdin.readline()
args = json.loads(raw.strip())
str = args["str"]
model = args["model"]
count = count_string_tokens(str, model)
print(count)
import spacy
import json
import sys

def parse_sentences(text: str, language_model: str):
    nlp = spacy.load(language_model)
    nlp.add_pipe("sentencizer")
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents]
    return sentences


raw = sys.stdin.readline()
args = json.loads(raw.strip())
text = args["text"]
language_model = args["languageModel"]
sentences = parse_sentences(text, language_model)
print("$DELIMITER$".join(sentences))
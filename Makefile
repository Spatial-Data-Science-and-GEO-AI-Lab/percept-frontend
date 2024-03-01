.PHONY: locales
locales:
	./util/txtToi18nJson.py src/nl-NL.txt > src/locales/nl-NL.json
	./util/txtToi18nJson.py src/en-GB.txt > src/locales/en-GB.json

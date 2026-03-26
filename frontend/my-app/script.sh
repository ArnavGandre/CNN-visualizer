find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) > /tmp/allfiles.txt
> /tmp/neverused.txt
while IFS= read -r f; do
  [ "$f" = "src/index.js" ] && continue
  [ "$f" = "src/App.js" ] && continue
  nm=$(basename "$f" .js)
  grep -R --exclude-dir=node_modules -nE "from ['\"].*/?$nm|require\(['\"].*/?$nm" src > /tmp/match.txt || echo "$f" >> /tmp/neverused.txt
done < /tmp/allfiles.txt
cat /tmp/neverused.txt









FROM metabase/metabase
EXPOSE 3000
CMD ["java", "-jar", "metabase.jar"]

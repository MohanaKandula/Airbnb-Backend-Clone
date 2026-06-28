package com.codingshuttle.projects.airBnbApp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

@Configuration
@EnableElasticsearchRepositories(basePackages = "com.codingshuttle.projects.airBnbApp.repository.elastic")
public class ElasticsearchConfig extends ElasticsearchConfiguration {

    @Override
    public ClientConfiguration clientConfiguration() {
        return ClientConfiguration.builder()
                .connectedTo("localhost:9200")
                .withConnectTimeout(2000) // 2-second timeout to prevent startup hangs if ES is offline
                .withSocketTimeout(2000)
                .build();
    }
}

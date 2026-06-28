package com.codingshuttle.projects.airBnbApp.repository.elastic;

import com.codingshuttle.projects.airBnbApp.document.HotelDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HotelElasticRepository extends ElasticsearchRepository<HotelDocument, String> {
    List<HotelDocument> findByCityIgnoreCase(String city);
    List<HotelDocument> findByStateIgnoreCase(String state);
    List<HotelDocument> findByNameContainingIgnoreCase(String name);
}
